import Link from "next/link";

export default function Home() {
  return (
    <main className="container landing">
      <section className="hero panel">
        <div>
          <span className="chip">Удобная кулинарная база</span>
          <h1>Книга рецептов для ежедневного планирования рациона</h1>
          <p className="text-muted">
            Храни продукты, собирай блюда из ингредиентов и получай авторасчет КБЖУ. Сервис
            помогает держать меню структурированным и понятным.
          </p>
          <div className="action-row">
            <Link className="btn-primary" href="/products/new">
              Добавить продукт
            </Link>
            <Link className="btn-secondary" href="/dishes/new">
              Создать блюдо
            </Link>
          </div>
        </div>
        <div className="hero-art">
          <Link className="hero-badge hero-badge-link" href="/products">
            <img src="/icons/products.svg" alt="" aria-hidden="true" className="section-icon" />
            <strong>Продукты</strong>
            <span className="text-muted">Категории, флаги, фото</span>
          </Link>
          <Link className="hero-badge hero-badge-link" href="/dishes">
            <img src="/icons/dishes.svg" alt="" aria-hidden="true" className="section-icon" />
            <strong>Блюда</strong>
            <span className="text-muted">Состав и КБЖУ</span>
          </Link>
        </div>
      </section>

      <section className="feature-grid">
        <article className="card feature-card">
          <h3>Умные карточки продуктов</h3>
          <p className="text-muted">
            Учитывай БЖУ, фильтруй по категориям, готовности и диетическим флагам.
          </p>
          <div className="action-row">
            <Link className="btn-secondary" href="/products">
              Открыть список
            </Link>
          </div>
        </article>
        <article className="card feature-card">
          <h3>Авторасчет КБЖУ блюд</h3>
          <p className="text-muted">
            Система считает пищевую ценность на порцию на основе реального состава ингредиентов.
          </p>
          <div className="action-row">
            <Link className="btn-secondary" href="/dishes">
              Перейти к блюдам
            </Link>
          </div>
        </article>
        <article className="card feature-card">
          <h3>Фото из файла и буфера</h3>
          <p className="text-muted">
            Загружай изображения как удобно: с компьютера, вставкой из clipboard или ссылкой.
          </p>
          <div className="action-row">
            <Link className="btn-secondary" href="/products/new">
              Попробовать
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
